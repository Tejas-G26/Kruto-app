import { useLocalSearchParams } from "expo-router";
import OtherUserProfileScreen from "../../app/pages/OtherUserProfileScreen";

export default function BusinessPage() {
  const { user_id } = useLocalSearchParams();
  console.log(user_id);

  return <OtherUserProfileScreen user_id={user_id} />;
}