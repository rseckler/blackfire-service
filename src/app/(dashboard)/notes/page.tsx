import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NotesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Notes</h2>
        <p className="text-muted-foreground">
          Your research and investment notes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Research Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[400px] items-center justify-center text-muted-foreground">
            Notes feature coming soon
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
