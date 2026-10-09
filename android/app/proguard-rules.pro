# Reglas ProGuard base para Supabase-kt y Ktor
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# Supabase Serialization
-keepclassmembers class * {
    @kotlinx.serialization.Serializable <fields>;
}
-keep class kotlinx.serialization.** { *; }
