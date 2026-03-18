import React from "react";
import { getUserById } from "./user.action";
import { AddressEditForm } from "./AdressEditForm"
import { BanEditForm } from "./BanUser";
import { UnBanEditForm } from "./UnBanUser";
import { RoleEditForm } from "./RoleUser";
import { RemoveUserForm } from "./RemoveUser";

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;   
  const user = await getUserById(id);

  if(!user){
    return <div>Utilisateur non trouvé</div>;
  }

  console.log("utilisateur123", user);

  return (
    <>
    <div className="text-center mb-8">
      <p>{user.id}</p>
      <h1 className="text-xl font-bold">{user.name}</h1>
      <p>Modifiez l&apos;infomation</p>
    </div>
    <div className="flex justify-center gap-130">   
      <div>
        <AddressEditForm user={user} />
      </div>
      <div className="flex flex-col justify-center gap-4">
        <RoleEditForm user={user} />
        {user.banned == false && <BanEditForm user={user} />}
        {user.banned && <UnBanEditForm user={user} />}
        <RemoveUserForm user={user} />
      </div>
    </div>
</>
  );
}