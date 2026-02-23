import { NextResponse, NextRequest } from "next/server";
import ogs from "open-graph-scraper";

export const GET = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ error: "url パラメータが必要です" }, { status: 400 });
  }

  try {
    const { result, error } = await ogs({ url: targetUrl });
    if (error) {
      return NextResponse.json({ error: "OGP の取得に失敗しました" }, { status: 422 });
    }

    return NextResponse.json({
      title: result.ogTitle ?? null,
      description: result.ogDescription ?? null,
      image: result.ogImage?.[0]?.url ?? null,
      siteName: result.ogSiteName ?? null,
      url: result.ogUrl ?? targetUrl,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "OGP の取得中にエラーが発生しました" }, { status: 500 });
  }
};
