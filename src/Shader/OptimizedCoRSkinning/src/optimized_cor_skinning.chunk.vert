#ifdef USE_SKINNING
    mat4 skinMatrixLBS = boneMatX * skinWeight.x
        + boneMatY * skinWeight.y
        + boneMatZ * skinWeight.z
        + boneMatW * skinWeight.w;

    vec4 transl = skinMatrixLBS * vec4( centerOfRotation, 1.0 );

    transformed = skinMatrix3 * ( transformed - centerOfRotation ) + transl.xyz / transl.w;
#endif
