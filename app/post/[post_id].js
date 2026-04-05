import { useLocalSearchParams } from "expo-router";
import PostFullDetailsScreen from "../pages/PostFullDetailScreen";

export default function PostPage() {
  const params = useLocalSearchParams();

  console.log("PARAMS:", params);

  const post_id = params?.post_id;

  if (!post_id) {
    console.log("post_id missing");
    return null; // or loader
  }

  return <PostFullDetailsScreen post_id={post_id} />;
}