"use client";

import { useUser } from "@clerk/nextjs";

export default function Welcome() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Welcome {user?.firstName}</h1>
    </div>
  );
}