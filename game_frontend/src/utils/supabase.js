/**
 * PUBLIC_INTERFACE
 * Supabase utility integration for high scores: handles save and leaderboard queries.
 * Uses environment variables for configuration.
 */

import { createClient } from '@supabase/supabase-js';

// Supabase Project URL and Anon Public Key from project environment
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || "https://rqsevgzicohzrmuwphfc.supabase.co";
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxc2V2Z3ppY29oenJtdXdwaGZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5NTczMjMsImV4cCI6MjA2NzUzMzMyM30._eNkex86h-JXsBHMyLpW-nq_BjtegOjjw1efQ71EXxc";

// PUBLIC_INTERFACE
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * PUBLIC_INTERFACE
 * Save a new high score entry (name, score) to the Supabase "scores" table
 * @param {string} player - Player's name or identifier (required)
 * @param {number} score - Score value to submit (required)
 * @returns {Promise<{error?: any, data?: object}>}
 */
export async function saveHighScore(player, score) {
  if (!player || typeof score !== 'number') {
    return { error: "Invalid player or score" };
  }
  // scores table: id, player, score, created_at
  const { error, data } = await supabase
    .from('scores')
    .insert([{ player, score }]);
  return { error, data };
}

/**
 * PUBLIC_INTERFACE
 * Retrieve leaderboard (high scores, sorted desc) from Supabase "scores" table.
 * @param {number} limit - Maximum number of entries to retrieve (default 10)
 * @returns {Promise<{error?: any, data?: object[]}>}
 */
export async function getLeaderboard(limit = 10) {
  const { data, error } = await supabase
    .from('scores')
    .select('player,score,created_at')
    .order('score', { ascending: false })
    .limit(limit);
  return { error, data };
}
