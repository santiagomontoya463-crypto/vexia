import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.json(
        {
          conectado: false,
          mensaje: "No se pudo comprobar la sesión de Supabase.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      conectado: true,
      mensaje: "La configuración de Supabase se ha cargado correctamente.",
    });
  } catch (error) {
    console.error("Error al comprobar Supabase:", error);

    return NextResponse.json(
      {
        conectado: false,
        mensaje: "Error al comprobar la configuración de Supabase.",
      },
      { status: 500 }
    );
  }
}
