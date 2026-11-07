
export function VideoVariantData({ data }: { data: unknown }) {
  if (!data || typeof data !== "object") {
    return (
      <p className="text-sm text-default-400">
        لا يوجد محتوى متاح.
      </p>
    );
  }

  const object = data as Record<string, unknown>;

  const title =
    typeof object.title === "string" ? object.title : null;

  const description =
    typeof object.description === "string"
      ? object.description
      : null;

  const presentationPath =
    typeof object.presentationPath === "string" &&
    object.presentationPath.startsWith("/") &&
    !object.presentationPath.startsWith("//")
      ? object.presentationPath
      : null;

  const videoUrl =
    typeof object.videoUrl === "string"
      ? object.videoUrl
      : typeof object.url === "string"
        ? object.url
        : null;

  if (!presentationPath && !videoUrl) {
    return (
      <p className="text-sm text-default-400">
        رابط العرض التقديمي أو الفيديو غير متوفر.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {title && (
        <h4 className="text-lg font-bold">{title}</h4>
      )}

      {description && (
        <p className="text-sm leading-7 text-default-500">
          {description}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-default-200 bg-black">
        {presentationPath ? (
          <iframe
            src={presentationPath}
            title={title ?? "العرض التقديمي للدرس"}
            className="aspect-video w-full border-0 bg-white"
            sandbox="allow-scripts"
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <video
            controls
            className="aspect-video w-full"
            src={videoUrl!}
          />
        )}
      </div>
    </div>
  );
}
