import { v4 as uuidV4 } from "uuid";

export const createRoom = (req, res) => {
  const roomId = uuidV4();
  res.json({ roomId });
};