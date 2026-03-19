import { createAccessControl } from "better-auth/plugins/access";
import {  adminAc } from "better-auth/plugins/admin/access";

const statement = { 
    project: ["create", "share", "update", "delete"], 
    ...adminAc.statements,
} as const; 
export const ac = createAccessControl(statement); 

export const user = ac.newRole({ 
    project: ["create"], 
}); 

export const admin = ac.newRole({ 
    project: ["create", "update", "delete"], 
    ...adminAc.statements,
    user: [...(adminAc.statements.user ?? []), "get","update", "ban"],
}); 

export const superadmin = ac.newRole({
  project: ["create", "update", "delete"],
  ...adminAc.statements,
  user: [...(adminAc.statements.user ?? []), "get", "create", "update", "delete", "ban"],
});

export const myCustomRole = ac.newRole({ 
    project: ["create", "update", "delete"], 
    user: ["ban"], 
}); 