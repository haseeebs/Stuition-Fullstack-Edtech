import { model, Schema, Document, Types } from "mongoose";

// Define the Profile interface
interface IProfile extends Document {
  user: Schema.Types.ObjectId;
  gender: "Male" | "Female" | "Other";
  dateOfBirth: string;
  about: string;
  contactNumber: string;
}

// Define the Profile schema
const profileSchema = new Schema<IProfile>({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  gender: { type: String, enum: ["Male", "Female", "Other"], trim: true, default: "Other" },
  dateOfBirth: { type: String, trim: true, default: "" },
  about: { type: String, trim: true, default: "" },
  contactNumber: { type: String, trim: true },
});

const Profile = model<IProfile>("Profile", profileSchema);

export default Profile;
