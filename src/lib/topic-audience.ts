import type { Topic } from "./content-schema";

interface TopicAudienceBehavior {
  showCompletion: boolean;
  trackLearningHistory: boolean;
}

const behaviorByAudience: Record<Topic["audience"], TopicAudienceBehavior> = {
  child: { showCompletion: true, trackLearningHistory: true },
  adult: { showCompletion: false, trackLearningHistory: false },
};

export function getTopicAudienceBehavior(audience: Topic["audience"]): TopicAudienceBehavior {
  return behaviorByAudience[audience];
}

export function isPublishedChildTopic(topic: {
  data: Pick<Topic, "audience" | "status">;
}): boolean {
  return topic.data.status === "published" && topic.data.audience === "child";
}
