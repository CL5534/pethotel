function PaymentResultCard({ result }) {
  if (!result) return null

  const className = result.success ? 'paymentResult success' : 'paymentResult fail'

  return (
    <div className={className}>
      <strong>{result.success ? '결제 성공' : '결제 실패'}</strong>
      <p>{result.message}</p>
    </div>
  )
}

export default PaymentResultCard
