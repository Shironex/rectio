'use client';

import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardLink,
  CardTitle,
  Progress,
} from '@rectio/ui';

export default function CardDemo() {
  return (
    <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
      <Card variant="raised" interactive>
        <CardHeader>
          <CardTitle>
            <CardLink href="#usage">Q1 close checklist</CardLink>
          </CardTitle>
          <CardDescription>Due 5 April</CardDescription>
          <CardAction>
            <Badge tone="warning">3 open</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Progress value={70} aria-label="Checklist done" size="sm" />
          <p className="text-sm text-fg-muted">7 of 10 tasks done.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Team plan</CardTitle>
          <CardDescription>12 seats, billed yearly</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-fg-muted">
          Approval rules, audit trail and bank feeds for 4 accounts.
        </CardContent>
        <CardFooter>
          <Button size="sm">Upgrade</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
