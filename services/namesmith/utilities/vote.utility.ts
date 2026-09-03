import { Rank, RANKS } from "../types/vote.types"

export const toRankNumber = (rank: Rank): number => RANKS.indexOf(rank) + 1
