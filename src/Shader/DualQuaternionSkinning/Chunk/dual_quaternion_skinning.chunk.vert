#ifdef USE_SKINNING
    transformed = ( skinMatrix * vec4( transformed, 1.0 ) ).xyz;
#endif
