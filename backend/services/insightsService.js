const Interaction = require('../models/Interaction');
const VectorHistory = require('../models/VectorHistory');
const User = require('../models/User');
const Memory = require('../models/Memory');
const { computeEngagement } = require('./vectorUpdate');

// ── Date helpers ────────────────────────────────────────────────────────────
const RANGES = {
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    all: Infinity,
};

function getRangeStart(range) {
    const r = RANGES[range] ?? RANGES.month;
    if (r === Infinity) return new Date(0);
    return new Date(Date.now() - r);
}

// ── Math helpers ────────────────────────────────────────────────────────────
const TRAITS = ['O', 'C', 'E', 'A', 'N'];
const TRAIT_LABELS = {
    O: 'Openness', C: 'Conscientiousness', E: 'Extraversion',
    A: 'Agreeableness', N: 'Neuroticism',
};

function vectorDistance(a, b) {
    if (!a || !b) return null;
    let sum = 0, count = 0;
    for (const k of TRAITS) {
        if (typeof a[k] === 'number' && typeof b[k] === 'number') {
            const d = a[k] - b[k];
            sum += d * d;
            count++;
        }
    }
    if (count === 0) return null;
    return Math.sqrt(sum / count);
}

function dominantTrait(vector) {
    if (!vector) return null;
    let best = null, val = -1;
    for (const k of TRAITS) {
        if (typeof vector[k] === 'number' && vector[k] > val) {
            val = vector[k];
            best = k;
        }
    }
    return best;
}

// ── Narrative generator ─────────────────────────────────────────────────────
/**
 * Build a one-sentence summary of the user's recent activity.
 * Output: human-readable, fact-driven.
 */
function buildNarrative({ totalInteractions, byType, traitConsumption, driftSinceOnboarding, range }) {
    if (totalInteractions === 0) {
        return "No engagement recorded yet — start scrolling your feed to build your insights.";
    }

    const top = Object.entries(traitConsumption || {}).sort((a, b) => b[1] - a[1])[0];
    const traitLabel = top ? TRAIT_LABELS[top[0]] : null;
    const traitPct = top ? Math.round(top[1] * 100) : 0;

    const totalEngagements = (byType.like || 0) + (byType.comment || 0);
    const rangeWord = range === 'week' ? 'this week' : range === 'month' ? 'this month' : 'so far';

    let driftPart = '';
    if (driftSinceOnboarding) {
        const significant = Object.entries(driftSinceOnboarding)
            .filter(([, v]) => Math.abs(v) >= 0.03)
            .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0];
        if (significant) {
            const [k, delta] = significant;
            const direction = delta > 0 ? 'grown' : 'softened';
            driftPart = ` Your ${TRAIT_LABELS[k]} has ${direction} by ${Math.abs(Math.round(delta * 100))}% since onboarding.`;
        }
    }

    const engagementPart = totalEngagements > 0
        ? `, with ${totalEngagements} active engagement${totalEngagements === 1 ? '' : 's'}`
        : '';

    if (traitLabel) {
        return `${rangeWord.charAt(0).toUpperCase() + rangeWord.slice(1)} you engaged most with ${traitLabel} content (${traitPct}%)${engagementPart}.${driftPart}`;
    }
    return `${rangeWord.charAt(0).toUpperCase() + rangeWord.slice(1)} you've recorded ${totalInteractions} interactions${engagementPart}.${driftPart}`;
}

// ── Personality archetype labels ────────────────────────────────────────────
function deriveArchetype(vector) {
    if (!vector) return { label: 'Unknown', desc: 'No personality data yet.' };

    const dom = dominantTrait(vector);
    const lowest = (() => {
        let best = null, val = 2;
        for (const k of TRAITS) {
            if (typeof vector[k] === 'number' && vector[k] < val) {
                val = vector[k];
                best = k;
            }
        }
        return best;
    })();

    const archetypes = {
        O: { label: 'Explorer', desc: 'Curious, creative, drawn to new ideas and experiences.' },
        C: { label: 'Builder', desc: 'Disciplined, organized, driven by goals and structure.' },
        E: { label: 'Connector', desc: 'Energized by people, expressive, socially engaged.' },
        A: { label: 'Harmonizer', desc: 'Empathetic, cooperative, attuned to others.' },
        N: { label: 'Reflector', desc: 'Emotionally aware, sensitive to nuance and depth.' },
    };

    return archetypes[dom] || archetypes.O;
}

// ── Main insights aggregation ───────────────────────────────────────────────
async function getInsights(userId, range = 'month') {
    const since = getRangeStart(range);

    const [user, allInteractions, history] = await Promise.all([
        User.findById(userId).select('personality createdAt').lean(),
        Interaction.find({
            user: userId,
            createdAt: { $gte: since },
        })
            .populate({ path: 'memory', select: 'user' })
            .lean(),
        VectorHistory.find({ user: userId }).sort({ createdAt: 1 }).lean(),
    ]);

    if (!user) return null;

    // Filter out self-interactions for analytics (same as vector formula)
    const interactions = allInteractions.filter(it => {
        const memOwner = it.memory?.user?.toString();
        return memOwner && memOwner !== userId.toString();
    });

    const totalInteractions = interactions.length;

    // ── Engagement breakdown by type ────────────────────────────────────────
    const byType = { view: 0, like: 0, comment: 0, profile_visit: 0, bookmark: 0, expand: 0 };
    for (const it of interactions) {
        if (byType[it.type] !== undefined) byType[it.type]++;
    }

    // ── Trait consumption (engagement-weighted average of memory vectors) ──
    const traitConsumptionRaw = { O: 0, C: 0, E: 0, A: 0, N: 0 };
    let totalEngagementWeight = 0;

    // Group by memory for per-memory engagement scoring
    const memoryGroups = {};
    for (const it of interactions) {
        const memId = it.memory?._id?.toString();
        if (!memId) continue;
        if (!memoryGroups[memId]) memoryGroups[memId] = { interactions: [], vector: null };
        memoryGroups[memId].interactions.push(it);
        if (!memoryGroups[memId].vector && it.memoryVector) {
            const mv = it.memoryVector;
            const valid = TRAITS.every(k => typeof mv[k] === 'number');
            if (valid) memoryGroups[memId].vector = mv;
        }
    }

    for (const memId in memoryGroups) {
        const g = memoryGroups[memId];
        if (!g.vector) continue;
        const E = computeEngagement(g.interactions);
        if (E <= 0) continue;
        for (const k of TRAITS) traitConsumptionRaw[k] += E * g.vector[k];
        totalEngagementWeight += E;
    }

    // Normalize to a probability distribution (sums to 1)
    const traitConsumption = { O: 0, C: 0, E: 0, A: 0, N: 0 };
    if (totalEngagementWeight > 0) {
        const sum = TRAITS.reduce((s, k) => s + traitConsumptionRaw[k], 0);
        if (sum > 0) {
            for (const k of TRAITS) traitConsumption[k] = traitConsumptionRaw[k] / sum;
        }
    }

    const topTrait = Object.entries(traitConsumption)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // ── Alignment ratio (% of engaged content that aligns with user vector) ─
    // Aligned = distance to user vector < 0.3 (arbitrary but reasonable threshold)
    let alignedCount = 0, comparedCount = 0;
    const userVec = user.personality;
    if (userVec && TRAITS.every(k => typeof userVec[k] === 'number')) {
        for (const memId in memoryGroups) {
            const g = memoryGroups[memId];
            if (!g.vector) continue;
            const dist = vectorDistance(userVec, g.vector);
            if (dist === null) continue;
            comparedCount++;
            if (dist < 0.3) alignedCount++;
        }
    }
    const alignmentRatio = comparedCount > 0 ? alignedCount / comparedCount : null;

    // ── Hourly heatmap (7 × 24, day-of-week × hour-of-day) ─────────────────
    // heatmap[day][hour] = count
    const heatmap = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const it of interactions) {
        const d = new Date(it.createdAt);
        heatmap[d.getDay()][d.getHours()]++;
    }

    // ── Vector evolution (chronological history) ───────────────────────────
    const vectorEvolution = history.map(h => ({
        date: h.createdAt,
        vector: h.vector,
        source: h.source,
    }));

    // ── Drift since onboarding ──────────────────────────────────────────────
    const onboardingVec = vectorEvolution.find(h => h.source === 'onboarding' || h.source === 'backfill')?.vector
        || vectorEvolution[0]?.vector
        || null;

    const driftSinceOnboarding = {};
    if (onboardingVec && userVec) {
        for (const k of TRAITS) {
            if (typeof onboardingVec[k] === 'number' && typeof userVec[k] === 'number') {
                driftSinceOnboarding[k] = parseFloat((userVec[k] - onboardingVec[k]).toFixed(4));
            } else {
                driftSinceOnboarding[k] = 0;
            }
        }
    }

    // ── Trait correlation insights (when engaging with X, you tend to Y) ───
    // For each trait, find the engagement type that's overrepresented when
    // the engaged memory is high in that trait (>0.65).
    const traitTypeCounts = {}; // { O: { like: 5, comment: 2, ... }, ... }
    let baselineTypeCounts = { like: 0, comment: 0, view: 0, profile_visit: 0 };
    let baselineMemoryCount = 0;

    for (const memId in memoryGroups) {
        const g = memoryGroups[memId];
        if (!g.vector) continue;
        baselineMemoryCount++;
        for (const it of g.interactions) {
            if (baselineTypeCounts[it.type] !== undefined) baselineTypeCounts[it.type]++;
        }
        for (const k of TRAITS) {
            if (g.vector[k] >= 0.65) {
                if (!traitTypeCounts[k]) traitTypeCounts[k] = { like: 0, comment: 0, view: 0, profile_visit: 0, _memCount: 0 };
                traitTypeCounts[k]._memCount++;
                for (const it of g.interactions) {
                    if (traitTypeCounts[k][it.type] !== undefined) traitTypeCounts[k][it.type]++;
                }
            }
        }
    }

    const correlations = [];
    if (baselineMemoryCount >= 5) {
        for (const k in traitTypeCounts) {
            const t = traitTypeCounts[k];
            if (t._memCount < 3) continue;
            for (const type of ['comment', 'like', 'profile_visit']) {
                const baseline = baselineTypeCounts[type] / baselineMemoryCount;
                const traitRate = t[type] / t._memCount;
                if (baseline > 0 && traitRate >= baseline * 1.5 && t[type] >= 2) {
                    correlations.push({
                        trait: k,
                        traitLabel: TRAIT_LABELS[k],
                        type,
                        ratio: parseFloat((traitRate / baseline).toFixed(2)),
                        text: `When you engage with high-${TRAIT_LABELS[k]} content, you ${type === 'profile_visit' ? 'visit profiles' : `${type}`} ${(traitRate / baseline).toFixed(1)}× more than usual.`,
                    });
                }
            }
        }
    }
    correlations.sort((a, b) => b.ratio - a.ratio);

    // ── Most influential authors ───────────────────────────────────────────
    // Rank authors by total engagement-weighted volume of their content the user consumed
    const authorScores = {};
    for (const memId in memoryGroups) {
        const g = memoryGroups[memId];
        const memDoc = allInteractions.find(it => it.memory?._id?.toString() === memId)?.memory;
        if (!memDoc) continue;
        const authorId = memDoc.user?.toString();
        if (!authorId) continue;
        const E = computeEngagement(g.interactions);
        if (!authorScores[authorId]) authorScores[authorId] = { score: 0, count: 0 };
        authorScores[authorId].score += E;
        authorScores[authorId].count += 1;
    }

    const topAuthorIds = Object.entries(authorScores)
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, 5)
        .map(([id, data]) => ({ id, ...data }));

    let influentialAuthors = [];
    if (topAuthorIds.length > 0) {
        const ids = topAuthorIds.map(a => a.id);
        const authorDocs = await User.find({ _id: { $in: ids } })
            .select('username profilePicture')
            .lean();
        const map = new Map(authorDocs.map(u => [u._id.toString(), u]));
        influentialAuthors = topAuthorIds.map(a => {
            const u = map.get(a.id);
            return u ? {
                id: a.id,
                username: u.username,
                profilePicture: u.profilePicture || null,
                memoryCount: a.count,
                influenceScore: parseFloat(a.score.toFixed(3)),
            } : null;
        }).filter(Boolean);
    }

    // ── Streak (consecutive days with at least one interaction, ending today) ─
    const dayStrings = new Set(
        interactions.map(it => new Date(it.createdAt).toISOString().split('T')[0])
    );
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
        const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const ds = d.toISOString().split('T')[0];
        if (dayStrings.has(ds)) streak++;
        else if (i > 0) break;  // Allow today to be empty (still in progress)
    }

    // ── Personality archetype ──────────────────────────────────────────────
    const archetype = deriveArchetype(userVec);

    // ── Narrative ──────────────────────────────────────────────────────────
    const narrative = buildNarrative({
        totalInteractions, byType, traitConsumption, driftSinceOnboarding, range,
    });

    return {
        range,
        rangeStart: since,
        currentVector: userVec,
        archetype,
        totalInteractions,
        byType,
        traitConsumption,
        topTrait,
        alignmentRatio,
        hourlyHeatmap: heatmap,
        vectorEvolution,
        driftSinceOnboarding,
        correlations,
        influentialAuthors,
        streak,
        narrative,
    };
}

module.exports = { getInsights };