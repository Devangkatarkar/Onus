"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  closeSnackSessionAction,
  markSnackPaidAction,
  submitSnackOrderAction,
  updateSnackPaymentAction,
  type SnackFormState,
} from "@/lib/actions/snacks";
import { getPaymentQrDisplay } from "@/lib/utils/payment-qr";
import { formatDateTime } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SnackSessionDetail } from "@/types";

function FormAlert({ state }: { state: SnackFormState }) {
  if (!state) return null;
  if (state.error)
    return (
      <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
        {state.error}
      </Alert>
    );
  if (state.success)
    return (
      <Alert className="border-emerald-500/50 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200">
        {state.success}
      </Alert>
    );
  return null;
}

export function SnackDetail({ data }: { data: SnackSessionDetail }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const sessionId = data.session.id;

  const [orderState, orderAction, orderPending] = useActionState<SnackFormState, FormData>(
    submitSnackOrderAction.bind(null, sessionId),
    null
  );
  const [payState, payAction, payPending] = useActionState<SnackFormState, FormData>(
    updateSnackPaymentAction.bind(null, sessionId),
    null
  );

  const qrDisplay = getPaymentQrDisplay(
    data.session.payment_qr_url,
    data.session.payment_link
  );

  async function handleMarkPaid() {
    const result = await markSnackPaidAction(sessionId);
    if (result.error) {
      alert(result.error);
      return;
    }
    startTransition(() => router.refresh());
  }

  async function handleClose() {
    await closeSnackSessionAction(sessionId);
    router.push("/community/snacks");
  }

  return (
    <div className="space-y-6">
      {!data.session.is_open && (
        <Alert className="border-amber-500/50 bg-amber-50 text-amber-950">
          This snack time is closed.
        </Alert>
      )}

      {/* Employee order */}
      {data.session.is_open && !data.isOrganizer && (
        <Card>
          <CardHeader>
            <CardTitle>Your order</CardTitle>
            <CardDescription>Send what you want to the organiser</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={orderAction} className="space-y-3">
              <Input
                name="order_text"
                required
                placeholder="e.g. 2 samosa, 1 cold coffee"
                defaultValue={data.myOrder?.order_text ?? ""}
              />
              <FormAlert state={orderState} />
              <Button type="submit" disabled={orderPending}>
                {orderPending ? "Sending..." : data.myOrder ? "Update order" : "Send order"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Organiser payment QR */}
      {data.isOrganizer && data.session.is_open && (
        <Card>
          <CardHeader>
            <CardTitle>Payment QR</CardTitle>
            <CardDescription>
              Upload your UPI QR image so others can pay you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={payAction} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="qr_image">QR image</Label>
                <Input
                  id="qr_image"
                  name="qr_image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_link">Or UPI / payment link (optional)</Label>
                <Input
                  id="payment_link"
                  name="payment_link"
                  placeholder="upi://pay?..."
                  defaultValue={data.session.payment_link ?? ""}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount_per_person">Amount per person (optional)</Label>
                  <Input
                    id="amount_per_person"
                    name="amount_per_person"
                    type="number"
                    step="0.01"
                    defaultValue={data.session.amount_per_person ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_note">Note (optional)</Label>
                  <Input
                    id="payment_note"
                    name="payment_note"
                    placeholder="Pay by 3pm"
                    defaultValue={data.session.payment_note ?? ""}
                  />
                </div>
              </div>
              <FormAlert state={payState} />
              <Button type="submit" disabled={payPending}>
                {payPending ? "Saving..." : "Save payment details"}
              </Button>
            </form>
            {data.isOrganizer && (
              <Button type="button" variant="outline" className="mt-3" onClick={handleClose}>
                Close snack time
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pay section for employees */}
      {!data.isOrganizer && qrDisplay && data.myOrder && (
        <Card>
          <CardHeader>
            <CardTitle>Pay organiser</CardTitle>
            {data.session.amount_per_person != null && (
              <CardDescription>Amount: {data.session.amount_per_person}</CardDescription>
            )}
            {data.session.payment_note && (
              <p className="text-sm text-muted-foreground">{data.session.payment_note}</p>
            )}
          </CardHeader>
          <CardContent className="flex flex-wrap items-start gap-6">
            <img
              src={qrDisplay}
              alt="Payment QR"
              width={200}
              height={200}
              className="rounded-lg border border-border"
            />
            <div>
              <Button
                type="button"
                disabled={data.myPaid}
                onClick={handleMarkPaid}
              >
                {data.myPaid ? "Marked as paid" : "I paid"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All orders */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({data.orders.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.orders.map((order) => (
            <div
              key={order.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border p-3"
            >
              <div>
                <p className="font-medium">{order.profiles?.name ?? "User"}</p>
                <p className="text-sm">{order.order_text}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(order.updated_at)}
                </p>
              </div>
              {order.paid ? (
                <Badge variant="success">Paid</Badge>
              ) : (
                <Badge variant="warning">Unpaid</Badge>
              )}
            </div>
          ))}
          {data.orders.length === 0 && (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
