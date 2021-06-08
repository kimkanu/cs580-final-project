#ifdef USE_SKINNING

	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );

    vec4 boneQuatX = getQuatBone( skinIndex.x );
    vec4 boneQuatY = getQuatBone( skinIndex.y );
    vec4 boneQuatZ = getQuatBone( skinIndex.z );
    vec4 boneQuatW = getQuatBone( skinIndex.w );

#endif