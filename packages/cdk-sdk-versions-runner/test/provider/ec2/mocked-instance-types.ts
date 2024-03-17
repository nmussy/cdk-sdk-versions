/**
 * What class and generation of instance to use
 *
 * We have both symbolic and concrete enums for every type.
 *
 * The first are for people that want to specify by purpose,
 * the second one are for people who already know exactly what
 * 'R4' means.
 */
export enum InstanceClass {
	/**
	 * Standard instances, 3rd generation
	 */
	STANDARD3 = "standard3",

	/**
	 * Standard instances, 3rd generation
	 */
	M3 = "m3",

	/**
	 * Standard instances, 4th generation
	 */
	STANDARD4 = "standard4",

	/**
	 * Standard instances, 4th generation
	 */
	M4 = "m4",
}

/**
 * What size of instance to use
 */
export enum InstanceSize {
	/**
	 * Instance size NANO (nano)
	 */
	NANO = "nano",

	/**
	 * Instance size MICRO (micro)
	 */
	MICRO = "micro",
}
