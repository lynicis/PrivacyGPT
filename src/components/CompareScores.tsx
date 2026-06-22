import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Score {
  letter: string
  points: number
}

interface CompareScoresProps {
  scoresA: Record<string, Score>
  scoresB: Record<string, Score>
  totalA: Score
  totalB: Score
}

const CATEGORIES = [
  { key: "training", label: "Model Training" },
  { key: "optOut", label: "Opt-Out Mechanism" },
  { key: "retention", label: "Data Retention" },
  { key: "deletion", label: "Data Deletion" },
  { key: "sharing", label: "Third-Party Sharing" },
  { key: "humanReview", label: "Human Review" },
]

export function CompareScores({
  scoresA,
  scoresB,
  totalA,
  totalB,
}: CompareScoresProps) {
  return (
    <div className="space-y-4">
      {/* Total Score */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Company A</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-4xl font-bold">{totalA.points}</div>
            <Badge variant={getGradeVariant(totalA.letter)}>
              {totalA.letter}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Company B</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-4xl font-bold">{totalB.points}</div>
            <Badge variant={getGradeVariant(totalB.letter)}>
              {totalB.letter}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Sub-scores */}
      <div className="space-y-2">
        {CATEGORIES.map(({ key, label }) => {
          const scoreA = scoresA[key]
          const scoreB = scoresB[key]

          const isABetter = scoreA.points > scoreB.points
          const isBBetter = scoreB.points > scoreA.points

          return (
            <div
              key={key}
              className="grid grid-cols-3 items-center gap-2 text-sm"
            >
              <div
                className={`rounded p-2 text-right ${isABetter ? "bg-green-100 dark:bg-green-900" : isBBetter ? "bg-red-100 dark:bg-red-900" : "bg-muted"}`}
              >
                {scoreA.letter} ({scoreA.points})
              </div>
              <div className="text-center font-medium">{label}</div>
              <div
                className={`rounded p-2 text-left ${isBBetter ? "bg-green-100 dark:bg-green-900" : isABetter ? "bg-red-100 dark:bg-red-900" : "bg-muted"}`}
              >
                {scoreB.letter} ({scoreB.points})
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getGradeVariant(
  grade: string
): "default" | "secondary" | "destructive" | "outline" {
  if (grade.startsWith("A")) return "default"
  if (grade.startsWith("B")) return "secondary"
  if (grade === "C") return "outline"
  return "destructive"
}
