import { VideoRoomClient } from "@/components/video/VideoRoomClient";

export default function CallPage({ params }: { params: { roomId: string } }) {
  return <VideoRoomClient roomId={params.roomId} />;
}

