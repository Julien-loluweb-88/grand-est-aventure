import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";
/**
 * make sure to use `as const` so typescript can infer the type correctly
 */
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
}); 

export const superadmin = ac.newRole({
  project: ["create", "update", "delete"],
});

export const myCustomRole = ac.newRole({ 
    project: ["create", "update", "delete"], 
    user: ["ban"], 
}); 