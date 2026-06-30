import { Card, CardContent } from "@/components/ui/card"
import { getProp } from "../lib/utils"
import {
  Lock,
  ShieldCheck,
  Trash2,
  Share2,
  UserCheck,
  Trophy,
  Minus,
} from "lucide-react"

interface Score {
  letter: string
  points: number
}

interface CompareScoresProps {
  scoresA: Record<string, Score | undefined>
  scoresB: Record<string, Score | undefined>
  totalA: Score
  totalB: Score
  nameA: string
  nameB: string
}

const CATEGORIES = [
  { key: "training", label: "Model Training", icon: Lock },
  { key: "optOut", label: "Opt-Out Mechanism", icon: ShieldCheck },
  { key: "retention", label: "Data Retention", icon: Trash2 },
  { key: "deletion", label: "Data Deletion", icon: Trash2 },
  { key: "sharing", label: "Third-Party Sharing", icon: Share2 },
  { key: "humanReview", label: "Human Review", icon: UserCheck },
]

function getGradeBadgeStyle(grade: string) {
  if (grade.startsWith("A"))
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
  if (grade.startsWith("B"))
    return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
  if (grade === "C")
    return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
  return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
}

function getSubScoreColor(score: number) {
  if (score >= 80) return "bg-emerald-500"
  if (score >= 50) return "bg-amber-500"
  return "bg-red-500"
}

export function CompareScores({
  scoresA,
  scoresB,
  totalA,
  totalB,
  nameA,
  nameB,
}: CompareScoresProps) {
  const winnerA = totalA.points > totalB.points
  const winnerB = totalB.points > totalA.points
  const isTie = totalA.points === totalB.points

  return (
    <div className="space-y-6">
      {/* Total Score Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card
          className={`overflow-hidden border-l-2 ${winnerA ? "border-l-emerald-500" : isTie ? "border-l-sky-500" : "border-l-border"}`}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {nameA}
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-foreground tabular-nums">
                    {totalA.points}
                  </span>
                  <span className="text-sm text-muted-foreground">pts</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div
                  className={`border px-3 py-1.5 font-mono text-lg font-bold ${getGradeBadgeStyle(totalA.letter)}`}
                >
                  {totalA.letter}
                </div>
                {winnerA && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <Trophy className="h-3 w-3" />
                    Leading
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`overflow-hidden border-l-2 ${winnerB ? "border-l-emerald-500" : isTie ? "border-l-sky-500" : "border-l-border"}`}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {nameB}
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-foreground tabular-nums">
                    {totalB.points}
                  </span>
                  <span className="text-sm text-muted-foreground">pts</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div
                  className={`border px-3 py-1.5 font-mono text-lg font-bold ${getGradeBadgeStyle(totalB.letter)}`}
                >
                  {totalB.letter}
                </div>
                {winnerB && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <Trophy className="h-3 w-3" />
                    Leading
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-scores Breakdown */}
      <div className="space-y-3">
        {CATEGORIES.map(({ key, label, icon: Icon }) => {
          const scoreA = getProp(scoresA, key)
          const scoreB = getProp(scoresB, key)

          if (scoreA === undefined || scoreB === undefined) return null

          const isABetter = scoreA.points > scoreB.points
          const isBBetter = scoreB.points > scoreA.points
          const isTieRow = scoreA.points === scoreB.points

          return (
            <div
              key={key}
              className="overflow-hidden border border-border bg-card"
            >
              {/* Category Header */}
              <div className="flex items-center gap-2 border-b border-border/50 bg-muted/20 px-4 py-2">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-bold tracking-wide text-foreground uppercase">
                  {label}
                </span>
              </div>

              {/* Score Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2">
                {/* Company A */}
                <div className="flex items-center gap-3 border-b border-border/50 p-3 sm:border-r sm:border-b-0">
                  <div className="w-12 shrink-0 text-right font-mono text-sm font-bold text-muted-foreground">
                    {scoreA.letter}
                  </div>
                  <div className="h-2 flex-1 overflow-hidden bg-border/60">
                    <div
                      className={`h-full transition-all ${getSubScoreColor(scoreA.points)}`}
                      style={{ width: `${scoreA.points}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 font-mono text-xs font-semibold text-muted-foreground tabular-nums">
                    {scoreA.points}
                  </span>
                  {isABetter && (
                    <Trophy className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  )}
                  {isTieRow && (
                    <Minus className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                  )}
                </div>

                {/* Company B */}
                <div className="flex items-center gap-3 p-3">
                  <div className="w-12 shrink-0 text-right font-mono text-sm font-bold text-muted-foreground">
                    {scoreB.letter}
                  </div>
                  <div className="h-2 flex-1 overflow-hidden bg-border/60">
                    <div
                      className={`h-full transition-all ${getSubScoreColor(scoreB.points)}`}
                      style={{ width: `${scoreB.points}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 font-mono text-xs font-semibold text-muted-foreground tabular-nums">
                    {scoreB.points}
                  </span>
                  {isBBetter && (
                    <Trophy className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  )}
                  {isTieRow && (
                    <Minus className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
