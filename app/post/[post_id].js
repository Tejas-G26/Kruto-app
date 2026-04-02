import { useLocalSearchParams } from "expo-router";
import PostFullDetailsScreen from "../pages/PostFullDetailScreen";

export default function PostPage() {
  const { post_id } = useLocalSearchParams();
  console.log(post_id);

  return <PostFullDetailsScreen post_id={post_id} />;
}