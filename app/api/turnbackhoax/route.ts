import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([
    {
      title: { rendered: "[PEMBOHONGAN] Bantuan Tunai Rp 2 Juta dari Kominfo" },
      date: new Date().toISOString(),
      _embedded: {
        "wp:featuredmedia": [
          { source_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Logo_of_the_Ministry_of_Communications_and_Information_Technology_of_the_Republic_of_Indonesia.svg/512px-Logo_of_the_Ministry_of_Communications_and_Information_Technology_of_the_Republic_of_Indonesia.svg.png" }
        ]
      }
    },
    {
      title: { rendered: "[SALAH] Video Presiden Bagikan Sembako dan Uang Tunai di Istana" },
      date: new Date(Date.now() - 86400000).toISOString(),
      _embedded: {
        "wp:featuredmedia": [
           { source_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Logo_MAFINDO.png/640px-Logo_MAFINDO.png" }
        ]
      }
    },
    {
      title: { rendered: "[HOAKS] Vaksin COVID-19 Varian Baru Berbahaya Bagi Jantung Tua" },
      date: new Date(Date.now() - 172800000).toISOString(),
      _embedded: {
        "wp:featuredmedia": [
          { source_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Logo_kementerian_kesehatan_republik_indonesia_2016.svg/512px-Logo_kementerian_kesehatan_republik_indonesia_2016.svg.png" }
        ]
      }
    },
    {
      title: { rendered: "[PENIPUAN] Link Undian Berhadiah Subsidi Tarif Listrik PLN" },
      date: new Date(Date.now() - 259200000).toISOString(),
      _embedded: {
        "wp:featuredmedia": [
          { source_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Logo_MAFINDO.png/640px-Logo_MAFINDO.png" }
        ]
      }
    }
  ]);
}
