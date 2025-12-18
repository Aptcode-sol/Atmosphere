# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# ============ React Native ============
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# ============ Agora SDK ============
-keep class io.agora.** { *; }
-dontwarn io.agora.**

# Fix for missing ThrowableExtension class
-dontwarn com.google.devtools.build.android.desugar.runtime.ThrowableExtension

# ============ OkHttp / Retrofit (if used) ============
-dontwarn okhttp3.**
-dontwarn okio.**

# ============ Keep native methods ============
-keepclasseswithmembernames class * {
    native <methods>;
}

# ============ Keep Parcelables ============
-keepclassmembers class * implements android.os.Parcelable {
    static ** CREATOR;
}

# ============ Keep Serializable ============
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}
