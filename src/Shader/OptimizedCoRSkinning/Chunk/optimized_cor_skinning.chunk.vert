#ifdef USE_SKINNING
    vec3 transl = vec3( 0.0 );
    transl += vec3( boneMatX * vec4( centerOfRotation, 1.0 ) ) * skinWeight.x;
    transl += vec3( boneMatY * vec4( centerOfRotation, 1.0 ) ) * skinWeight.y;
    transl += vec3( boneMatZ * vec4( centerOfRotation, 1.0 ) ) * skinWeight.z;
    transl += vec3( boneMatW * vec4( centerOfRotation, 1.0 ) ) * skinWeight.w;

    transformed = skinMatrix3 * ( transformed - centerOfRotation ) + transl;
#endif
