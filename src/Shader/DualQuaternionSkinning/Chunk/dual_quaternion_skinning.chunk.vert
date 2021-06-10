#ifdef USE_SKINNING
    vec4 transformed4 = skinMatrix * vec4( transformed, 1.0 );
    transformed = transformed4.xyz / transformed4.w;
#endif
