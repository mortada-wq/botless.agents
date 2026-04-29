import React from "react";

// Reusable animated avatar stage. state: idle | listening | talking | thinking | excited | celebrating | farewell
export default function AvatarStage({ image, name, state = "idle", size = "lg", overlay = true, testId = "avatar-stage" }) {
  const sizes = {
    sm: "w-24 h-24",
    md: "w-40 h-40",
    lg: "w-56 h-56",
    xl: "w-80 h-80",
    fluid: "w-full aspect-square max-w-md",
  };
  const stageSize = sizes[size] || sizes.lg;
  const stateClass = `state-${state}`;

  const label = {
    idle: "Idle",
    listening: "Listening",
    talking: "Talking",
    thinking: "Thinking",
    excited: "Excited",
    celebrating: "Celebrating",
    farewell: "Farewell",
  }[state];

  return (
    <div className={`bk-stage bk-grain p-6 md:p-10 flex items-center justify-center ${overlay ? "" : "bg-transparent"}`} data-testid={testId}>
      {state === "thinking" && (
        <div className="bk-thinking-dots" aria-hidden>
          <span /><span /><span />
        </div>
      )}
      {state === "celebrating" && <div className="bk-celebrate-burst" aria-hidden />}
      <div className={`bk-avatar-wrap ${stageSize} ${stateClass}`}>
        {image ? (
          <img src={image} alt={name || "agent"} className="bk-avatar-img" draggable={false} />
        ) : (
          <div className="bk-avatar-img bg-surface-2 flex items-center justify-center text-ink-muted serif text-4xl">
            {(name || "A").slice(0, 1)}
          </div>
        )}
      </div>
      {overlay && (
        <div className="absolute top-4 left-4 bk-chip" data-testid="avatar-state-chip">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E26D5C] animate-pulse" />
          {label}
        </div>
      )}
    </div>
  );
}
