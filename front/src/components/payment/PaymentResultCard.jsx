function PaymentResultCard({ result, onRetry }) {
  if (!result) return null

  const className = result.success ? 'paymentResult success' : 'paymentResult fail'

  return (
    <div className={className}>
      <strong>{result.success ? '결제 성공' : '결제 실패'}</strong>
      <p>{result.message}</p>
      {result.paymentKey ? <p className="paymentMeta">paymentKey: {result.paymentKey}</p> : null}
      {result.orderId ? <p className="paymentMeta">orderId: {result.orderId}</p> : null}
      {result.transactionId ? <p className="paymentMeta">transactionId: {result.transactionId}</p> : null}
      {!result.success ? (
        <button type="button" className="paymentRetryButton" onClick={onRetry}>
          재시도
        </button>
      ) : null}
    </div>
  )
}

export default PaymentResultCard
