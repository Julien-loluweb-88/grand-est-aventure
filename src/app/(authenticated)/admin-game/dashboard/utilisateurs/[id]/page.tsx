import React from "react";
import { getUserById } from "./user.action";
import { AddressEditForm } from "./AdressEditForm"
import { BanEditForm } from "./BanUser";
import { UnBanEditForm } from "./UnBanUser";
import { RoleEditForm } from "./RoleUser";

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
    <div>
        {user.id}
    <h1>{user.name }</h1>
    <p>Modifiez l&apos;infomation</p>
    <AddressEditForm user={user}/>
</div>
<div>
  <RoleEditForm user={user} />
</div>
<div>

  {user.banned == false &&  <BanEditForm user={user}/>}
  {user.banned && <UnBanEditForm user={user}/> }

</div>
</>
  );
}