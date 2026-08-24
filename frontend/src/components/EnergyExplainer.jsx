// Plain-language explanation of the impact energy formula, shared between the InfoTooltip
// pop-ups (short context) and ImpactView's full "About this estimate" section (long context).
export function EnergyExplainer({ compact = false }) {
  return (
    <>
      <p className={compact ? 'mb-2' : 'mb-3'}>
        This is an estimate of the energy that would be released if the asteroid struck Earth,
        based only on its size and speed. It is not a prediction that an impact will actually
        happen, and it ignores how close any recorded approach came.
      </p>
      <p className={compact ? 'mb-2' : 'mb-3'}>
        <span className="text-[var(--color-bone)]">The formula:</span> energy = half of mass
        times velocity squared, the standard physics formula for kinetic energy. Mass is
        estimated from the asteroid's diameter, assuming a typical rocky density of 3,000 kg per
        cubic meter, since NASA's feed reports size but not what the object is made of. The
        result is converted into megatons of TNT so it is easier to compare.
      </p>
      <p>
        For scale: the Hiroshima bomb released about 0.015 megatons. The 1908 Tunguska explosion,
        which flattened 2,000 square kilometers of Siberian forest, is estimated at 10-15
        megatons.
      </p>
    </>
  )
}
