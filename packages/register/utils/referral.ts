import {namehash} from "@siddomains/sidjs";

const emptySignature = [
  '0x0000000000000000000000000000000000000000',
  '0x0000000000000000000000000000000000000000000000000000000000000000',
  0,
  0,
  '0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
]

function getGraphQLUrl(chainId) {
  if (chainId === 56 || chainId === 42161) {
    return 'https://graphigo.prd.space.id/query'
  }
  return 'https://graphigo.dev.space.id/query'
}

export async function getReferralSignature(domain, chainId) {
  if (!domain || !chainId) return emptySignature
  try {
    const res = await fetch(getGraphQLUrl(chainId), {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: `{
                        signReferral(domain:"${domain}", chainId: ${chainId}) {
                            signature
                            referrerAddress
                            signedAt
                            referrerCount
                        }
                    }`
      })
    })
    const resJson = await res.json()
    const signReferral = resJson?.data?.signReferral
    if (signReferral) {
      return [
        signReferral.referrerAddress,
        namehash(domain),
        signReferral.referrerCount,
        signReferral.signedAt,
        signReferral.signature,
      ]
    } else {
      throw new Error('sign referral fail')
    }
  } catch (e) {
    console.error(e)
    throw new Error('sign referral fail')
  }
}
