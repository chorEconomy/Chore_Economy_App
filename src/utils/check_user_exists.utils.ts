import { NotFoundError } from "../models/errors.js";
import { Admin, Kid, Parent } from "../modules/users/user.model.js";

//Find one user in the db with the provided email
export async function check_if_user_exist_with_email(userEmail: string) {
  if (!userEmail) return false;
  const user =
    (await Parent.findOne({ email: userEmail })) ||
    (await Admin.findOne({ email: userEmail }));
  if (!user) {
    throw new NotFoundError("User not found");
  }
  return user;
}

//Find one user in the db with the provided ID
export async function check_if_user_exists(userId = ""): Promise<any> {
  if (!userId) return false;

  const user =
    (await Parent.findById(userId)) ||
    (await Kid.findById(userId)) ||
    (await Admin.findById(userId));

  return user || null;
}

export async function findUserAndRoleById(userId: string) {
  const kid = await Kid.findById(userId);
  if (kid) return { role: "Kid", user: kid };

  const parent = await Parent.findById(userId);
  if (parent) return { role: "Parent", user: parent };

  const admin = await Admin.findById(userId);
  if (admin) return { role: "Admin", user: admin };

  throw new Error("User not found in any role");
}

export async function getUserByEmailAndRole(
  email: string,
  role: string,
  model: any
) {
  try {
    const user = await model.findOne({ email, role });
    if (!user) {
      return false;
    } else {
      return user;
    }
  } catch (error: any) {
    return error.message;
  }
}
