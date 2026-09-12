// SSO callback route. In production this would complete a Clerk/SSO sign-in
// flow; in this deployment it simply shows a placeholder message.
export default function SSOCallback() {
  return <div className="p-6">Authentication callback is unavailable locally.</div>;
}
