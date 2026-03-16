import React from "react";
import { getUserById } from "./user.action";
import { AddressEditForm } from "./AdressEditForm"

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;   
  const user = await getUserById(id);

  console.log("utilisateur123", user);

  return (
    <div>
        {user.id}
    <h1>{user.name }</h1>
    <AddressEditForm user={user}/>
</div>
  );
}