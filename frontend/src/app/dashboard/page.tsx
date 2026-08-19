import LiveTitle from '@/components/LiveTitle';
import RealtimeList from '@/components/RealtimeList';
import React from 'react';

async function Page() {
  return <div>Not authorized</div>;

  return (
    <div className=" flex flex-col justify-center mx-auto max-w-5xl w-full p-4">
      <LiveTitle />
      <RealtimeList />
    </div>
  );
}

export default Page;
