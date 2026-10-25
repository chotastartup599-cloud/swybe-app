// Chhote common helpers (ID check, regex escape, India ka din, quiz answer chhupana)

export const isObjectId = (value) =>
  typeof value === "string" && /^[a-f0-9]{24}$/i.test(value);

// User ke search text ko regex me safe banata hai (invalid regex se 500 error / ReDoS nahi hoga)
export function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const DAY_MS = 24 * 60 * 60 * 1000;
const IST_OFFSET_MS = 330 * 60 * 1000; // UTC+5:30

export const istDayIndex = (ms = Date.now()) => Math.floor((ms + IST_OFFSET_MS) / DAY_MS);
export const istDayStartMs = (idx = istDayIndex()) => idx * DAY_MS - IST_OFFSET_MS;

// Quiz ka sahi jawab (correctOptionIndex) client ko kabhi nahi jaana chahiye
export function stripQuizAnswer(post) {
  if (!post) return post;
  const obj = typeof post.toObject === "function" ? post.toObject() : { ...post };
  if (obj.quizData) {
    const { correctOptionIndex, ...rest } = obj.quizData;
    obj.quizData = rest;
  }
  return obj;
}