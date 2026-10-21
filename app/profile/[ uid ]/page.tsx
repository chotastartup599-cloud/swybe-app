import UserProfileClient from './UserProfileClient';

export const dynamic = 'force-dynamic';

export default function UserProfilePage({ params }: { params: { uid: string } }) {
  return <UserProfileClient uid={params.uid} />;
}
