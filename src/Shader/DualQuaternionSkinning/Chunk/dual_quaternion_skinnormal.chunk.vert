#ifdef USE_SKINNING
    mat4 skinMatrix = getDLBMat4( skinWeight, boneDqX, boneDqY, boneDqZ, boneDqW );
    objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
    #ifdef USE_TANGENT
      objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
    #endif
#endif