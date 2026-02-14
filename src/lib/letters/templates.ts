import type { LetterData } from './types';

export interface LetterContent {
  titleEn: string;
  titleEs: string;
  paragraphsEn: string[];
  paragraphsEs: string[];
}

function getAssignmentContent(data: LetterData): LetterContent {
  const scheduleInfo = data.schedule
    ? ` Your child's sessions are scheduled for ${data.schedule}.`
    : '';

  return {
    titleEn: 'Notice of Intervention Assignment',
    titleEs: 'Aviso de Asignacion a Intervencion',
    paragraphsEn: [
      `Dear Parent/Guardian of ${data.studentName},`,
      `We are writing to let you know that ${data.studentName} (Grade ${data.studentGrade}) has been identified for additional academic support through our intervention program. Based on recent assessment data, your child will receive targeted instruction using the ${data.curriculumLabel} curriculum as a Tier ${data.tier} intervention.`,
      `Tier ${data.tier} support means your child will participate in ${data.tier === 2 ? 'small-group' : 'intensive, individualized'} sessions designed to build foundational skills and close learning gaps.${scheduleInfo}`,
      `Your child's interventionist is ${data.interventionistName}. If you have any questions about this program or your child's participation, please do not hesitate to reach out at ${data.interventionistContact}.`,
      `We look forward to partnering with you to support ${data.studentName}'s growth and success.`,
    ],
    paragraphsEs: [
      `Estimado padre/tutor de ${data.studentName},`,
      `Le escribimos para informarle que ${data.studentName} (Grado ${data.studentGrade}) ha sido identificado(a) para recibir apoyo academico adicional a traves de nuestro programa de intervencion. Segun los datos de evaluaciones recientes, su hijo(a) recibira instruccion enfocada utilizando el curriculo ${data.curriculumLabel} como una intervencion de Nivel ${data.tier}.`,
      `El apoyo de Nivel ${data.tier} significa que su hijo(a) participara en sesiones ${data.tier === 2 ? 'en grupos pequenos' : 'intensivas e individualizadas'} disenadas para desarrollar habilidades fundamentales y cerrar brechas de aprendizaje.${data.schedule ? ` Las sesiones de su hijo(a) estan programadas para ${data.schedule}.` : ''}`,
      `El/la intervencionista de su hijo(a) es ${data.interventionistName}. Si tiene alguna pregunta sobre este programa o la participacion de su hijo(a), no dude en comunicarse al ${data.interventionistContact}.`,
      `Esperamos colaborar con usted para apoyar el crecimiento y el exito de ${data.studentName}.`,
    ],
  };
}

function getExitContent(data: LetterData): LetterContent {
  const growthInfo = data.startScore != null && data.endScore != null
    ? ` Over the course of the intervention, ${data.studentName}'s score improved from ${data.startScore} to ${data.endScore}${data.growth != null ? `, representing a growth of ${data.growth} points` : ''}.`
    : '';

  const durationInfo = data.interventionDuration
    ? ` ${data.studentName} participated in the intervention program for ${data.interventionDuration}.`
    : '';

  return {
    titleEn: 'Notice of Intervention Exit',
    titleEs: 'Aviso de Salida de Intervencion',
    paragraphsEn: [
      `Dear Parent/Guardian of ${data.studentName},`,
      `We are pleased to inform you that ${data.studentName} (Grade ${data.studentGrade}) has successfully completed the ${data.curriculumLabel} intervention program.${durationInfo}`,
      `Your child has demonstrated sufficient progress to transition out of Tier ${data.tier} support.${growthInfo}`,
      `Moving forward, ${data.studentName} will continue to be monitored through regular classroom assessments to ensure continued success. If at any point additional support is needed, we will reach out to discuss next steps.`,
      `Thank you for your partnership throughout this process. If you have any questions, please contact ${data.interventionistName} at ${data.interventionistContact}.`,
    ],
    paragraphsEs: [
      `Estimado padre/tutor de ${data.studentName},`,
      `Nos complace informarle que ${data.studentName} (Grado ${data.studentGrade}) ha completado exitosamente el programa de intervencion ${data.curriculumLabel}.${data.interventionDuration ? ` ${data.studentName} participo en el programa de intervencion durante ${data.interventionDuration}.` : ''}`,
      `Su hijo(a) ha demostrado progreso suficiente para hacer la transicion fuera del apoyo de Nivel ${data.tier}.${data.startScore != null && data.endScore != null ? ` Durante el curso de la intervencion, la puntuacion de ${data.studentName} mejoro de ${data.startScore} a ${data.endScore}${data.growth != null ? `, lo que representa un crecimiento de ${data.growth} puntos` : ''}.` : ''}`,
      `En adelante, ${data.studentName} continuara siendo monitoreado(a) a traves de evaluaciones regulares en el aula para asegurar su exito continuo. Si en algun momento se necesita apoyo adicional, nos comunicaremos con usted para discutir los proximos pasos.`,
      `Gracias por su colaboracion durante este proceso. Si tiene alguna pregunta, comuniquese con ${data.interventionistName} al ${data.interventionistContact}.`,
    ],
  };
}

function getIntensificationContent(data: LetterData): LetterContent {
  return {
    titleEn: 'Notice of Intervention Intensification',
    titleEs: 'Aviso de Intensificacion de Intervencion',
    paragraphsEn: [
      `Dear Parent/Guardian of ${data.studentName},`,
      `We are writing to update you on ${data.studentName}'s (Grade ${data.studentGrade}) progress in the ${data.curriculumLabel} intervention program. After careful review of recent progress monitoring data, we have determined that your child would benefit from more intensive support.`,
      `As a result, ${data.studentName}'s intervention plan will be adjusted. This may include more frequent sessions, smaller group sizes, or additional targeted instruction to address specific skill areas. These changes are designed to provide your child with the best opportunity for growth.`,
      `We value your input and encourage you to share any observations about your child's learning at home. Your insights help us tailor our approach to best meet ${data.studentName}'s needs.`,
      `If you have any questions or would like to discuss these changes, please contact ${data.interventionistName} at ${data.interventionistContact}. We remain committed to supporting ${data.studentName}'s academic success.`,
    ],
    paragraphsEs: [
      `Estimado padre/tutor de ${data.studentName},`,
      `Le escribimos para actualizarle sobre el progreso de ${data.studentName} (Grado ${data.studentGrade}) en el programa de intervencion ${data.curriculumLabel}. Despues de una revision cuidadosa de los datos recientes de monitoreo de progreso, hemos determinado que su hijo(a) se beneficiaria de un apoyo mas intensivo.`,
      `Como resultado, el plan de intervencion de ${data.studentName} sera ajustado. Esto puede incluir sesiones mas frecuentes, grupos mas pequenos o instruccion adicional enfocada para abordar areas de habilidades especificas. Estos cambios estan disenados para brindarle a su hijo(a) la mejor oportunidad de crecimiento.`,
      `Valoramos su aporte y le animamos a compartir cualquier observacion sobre el aprendizaje de su hijo(a) en casa. Sus perspectivas nos ayudan a adaptar nuestro enfoque para satisfacer mejor las necesidades de ${data.studentName}.`,
      `Si tiene alguna pregunta o desea discutir estos cambios, comuniquese con ${data.interventionistName} al ${data.interventionistContact}. Seguimos comprometidos en apoyar el exito academico de ${data.studentName}.`,
    ],
  };
}

function getProgressReportContent(data: LetterData): LetterContent {
  const attendanceInfo = data.sessionsAttended != null && data.totalSessions != null
    ? `${data.studentName} has attended ${data.sessionsAttended} out of ${data.totalSessions} scheduled sessions${data.attendancePercentage != null ? ` (${data.attendancePercentage}% attendance rate)` : ''}.`
    : '';

  const trendLabels: Record<string, string> = {
    improving: 'an improving trend',
    stable: 'a stable trend',
    declining: 'a declining trend',
  };
  const trendLabelsEs: Record<string, string> = {
    improving: 'una tendencia de mejora',
    stable: 'una tendencia estable',
    declining: 'una tendencia de descenso',
  };

  const scoreInfo = data.currentScore != null
    ? ` ${data.studentName}'s most recent score is ${data.currentScore}${data.goal != null ? ` (goal: ${data.goal})` : ''}${data.trend ? `, showing ${trendLabels[data.trend]}` : ''}.`
    : '';

  const scoreInfoEs = data.currentScore != null
    ? ` La puntuacion mas reciente de ${data.studentName} es ${data.currentScore}${data.goal != null ? ` (meta: ${data.goal})` : ''}${data.trend ? `, mostrando ${trendLabelsEs[data.trend]}` : ''}.`
    : '';

  const pmSummary = data.pmScores && data.pmScores.length > 0
    ? ` Progress monitoring data points collected: ${data.pmScores.map(p => `${p.date}: ${p.score}`).join(', ')}.`
    : '';

  const pmSummaryEs = data.pmScores && data.pmScores.length > 0
    ? ` Datos de monitoreo de progreso recopilados: ${data.pmScores.map(p => `${p.date}: ${p.score}`).join(', ')}.`
    : '';

  const commentsSection = data.comments
    ? `Additional comments from the interventionist: ${data.comments}`
    : '';

  const commentsSectionEs = data.comments
    ? `Comentarios adicionales del/la intervencionista: ${data.comments}`
    : '';

  return {
    titleEn: 'Family Progress Report',
    titleEs: 'Informe de Progreso Familiar',
    paragraphsEn: [
      `Dear Parent/Guardian of ${data.studentName},`,
      `This report provides an update on ${data.studentName}'s (Grade ${data.studentGrade}) participation in the ${data.curriculumLabel} intervention program (Tier ${data.tier}).`,
      attendanceInfo ? `Attendance: ${attendanceInfo}` : '',
      scoreInfo ? `Progress:${scoreInfo}${pmSummary}` : '',
      commentsSection,
      `Thank you for your continued support. Regular attendance is important for your child's success in the intervention program. If you have any questions, please contact ${data.interventionistName} at ${data.interventionistContact}.`,
    ].filter(p => p.length > 0),
    paragraphsEs: [
      `Estimado padre/tutor de ${data.studentName},`,
      `Este informe proporciona una actualizacion sobre la participacion de ${data.studentName} (Grado ${data.studentGrade}) en el programa de intervencion ${data.curriculumLabel} (Nivel ${data.tier}).`,
      attendanceInfo ? `Asistencia: ${data.studentName} ha asistido a ${data.sessionsAttended} de ${data.totalSessions} sesiones programadas${data.attendancePercentage != null ? ` (${data.attendancePercentage}% de tasa de asistencia)` : ''}.` : '',
      scoreInfoEs ? `Progreso:${scoreInfoEs}${pmSummaryEs}` : '',
      commentsSectionEs,
      `Gracias por su apoyo continuo. La asistencia regular es importante para el exito de su hijo(a) en el programa de intervencion. Si tiene alguna pregunta, comuniquese con ${data.interventionistName} al ${data.interventionistContact}.`,
    ].filter(p => p.length > 0),
  };
}

const templateFunctions: Record<string, (data: LetterData) => LetterContent> = {
  assignment: getAssignmentContent,
  exit: getExitContent,
  intensification: getIntensificationContent,
  progress_report: getProgressReportContent,
};

export function getLetterContent(data: LetterData): LetterContent {
  const fn = templateFunctions[data.type];
  if (!fn) {
    throw new Error(`Unknown letter type: ${data.type}`);
  }
  return fn(data);
}
