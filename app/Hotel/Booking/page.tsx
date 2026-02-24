import { Suspense } from "react";
import BookingClient from "./BookingClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "60px 0", textAlign: "center", color: "#9ca3af" }}>
          로딩중...
        </div>
      }
    >
      <BookingClient />
    </Suspense>
  );
}