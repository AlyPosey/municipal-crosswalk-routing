/**
 * lib/conversation.js — the question-path state machine.
 *
 * Owns ConversationPosition and AnswerRecord (see specs/002-flow-clarity-voice/data-model.md).
 * Holds no DOM references and performs no rendering; app.js subscribes and re-renders.
 *
 * The core invariant: `position` (where the parent is) and `answered` (what they have answered) are
 * separate. Going back moves the cursor only — it never touches an answer. Only `restart()` clears
 * answers. The transcript and the confirmation summary are always built from `answered`, never from
 * `position`, so a correction shows up everywhere at once.
 */

export function createConversation(steps) {
  let position = 0;
  let resultVisible = false;
  const values = {};
  const answered = {};
  for (const step of steps) {
    values[step.key] = step.key === 'danger' ? null : '';
    answered[step.key] = false;
  }

  const listeners = new Set();

  function notify() {
    const state = getState();
    for (const fn of listeners) fn(state);
  }

  function getState() {
    return {
      position,
      answers: { ...values },
      answered: { ...answered },
      resultVisible,
    };
  }

  function setAnswer(key, value) {
    values[key] = value;
    answered[key] = true;
    resultVisible = false;
    if (position < steps.length) position++;
    notify();
  }

  function back() {
    if (position > 0) position--;
    resultVisible = false;
    notify();
  }

  function isComplete() {
    return steps.every((s) => answered[s.key]);
  }

  function goToConfirm() {
    if (!isComplete()) return;
    position = steps.length;
    resultVisible = false;
    notify();
  }

  function confirm() {
    resultVisible = true;
    notify();
  }

  function restart() {
    position = 0;
    resultVisible = false;
    for (const step of steps) {
      values[step.key] = step.key === 'danger' ? null : '';
      answered[step.key] = false;
    }
    notify();
  }

  function canGoBack() {
    return position > 0;
  }

  function summary() {
    return steps
      .filter((s) => answered[s.key])
      .map((s) => ({ question: s.question, key: s.key, value: values[s.key] }));
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  return {
    getState,
    setAnswer,
    back,
    goToConfirm,
    confirm,
    restart,
    canGoBack,
    isComplete,
    summary,
    subscribe,
  };
}
