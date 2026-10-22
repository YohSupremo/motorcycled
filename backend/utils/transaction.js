import mongoose from "mongoose";

const MAX_ATTEMPTS = 3;
const MAX_COMMIT_ATTEMPTS = 3;

const isTransientTransactionError = (error) =>
  error?.hasErrorLabel?.("TransientTransactionError") ||
  error?.code === 112 ||
  /WriteConflict|TransientTransactionError/i.test(error?.message || "");

const isUnknownCommitResult = (error) =>
  error?.hasErrorLabel?.("UnknownTransactionCommitResult") ||
  /UnknownTransactionCommitResult/i.test(error?.message || "");

/**
 * Run a unit of work inside a MongoDB transaction.
 * Retries the whole callback on transient write conflicts.
 */
export const runInTransaction = async (work) => {
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();
      const result = await work(session);

      for (let commitAttempt = 1; commitAttempt <= MAX_COMMIT_ATTEMPTS; commitAttempt += 1) {
        try {
          await session.commitTransaction();
          return result;
        } catch (error) {
          if (!isUnknownCommitResult(error) || commitAttempt === MAX_COMMIT_ATTEMPTS) {
            throw error;
          }
        }
      }
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }

      lastError = error;

      if (!isTransientTransactionError(error) || attempt === MAX_ATTEMPTS) {
        throw error;
      }
    } finally {
      await session.endSession();
    }
  }

  throw lastError;
};
