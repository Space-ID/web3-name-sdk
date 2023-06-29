import {namehash} from "@siddomains/sidjs";

const emptySignature = [
  '0x0000000000000000000000000000000000000000',
  '0x0000000000000000000000000000000000000000000000000000000000000000',
  0,
  0,
  '0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
]

function getApiUrl(chainId) {
  if (chainId === 56 || chainId === 42161) {
    return 'https://api.space.id/v1/sign-referral'
  }
  return 'https://api.stg.space.id/v1/sign-referral'
}

export async function getReferralSignature(domain, chainId) {
  if (!domain || !chainId) return emptySignature
  try {
    const res = await fetch(getApiUrl(chainId), {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        domain,
        chainId,
      })
    })
    const resJson = await res.json()
    const signReferral = resJson?.data
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
