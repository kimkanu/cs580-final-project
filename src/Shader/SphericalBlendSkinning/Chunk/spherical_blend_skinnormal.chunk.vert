#ifdef USE_SKINNING
    vec4 qlerped = getQLERP(
      skinWeight,
      boneQuatX,
      boneQuatY,
      boneQuatZ,
      boneQuatW
    );

    mat3 skinMatrix3 = quatToMat3( qlerped );
    
    objectNormal = skinMatrix3 * objectNormal;
    #ifdef USE_TANGENT
      objectTangent = skinMatrix3 * objectTangent;
    #endif
#endif