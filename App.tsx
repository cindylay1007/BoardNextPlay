import React, { useEffect, useState } from 'react'
import { Container, Row, Col, Button, Spinner, Navbar, Nav } from 'react-bootstrap'
import { FiPlus, FiUsers, FiTag } from 'react-icons/fi'
import { supabase } from './lib/supabaseClient'
import { Board } from './components/Board/Board'
import { StatsHeader } from './components/Stats/StatsHeader'
import { FilterBar } from './components/Filters/FilterBar'
import { TaskModal } from './components/Modals/TaskModal'
import { TeamMemberModal } from './components/Modals/TeamMemberModal'
import { LabelModal } from './components/Modals/LabelModal'
import { useBoardData } from './hooks/useBoardData'
import { Task, TaskStatus, Priority } from './types'

function App() {
  const [session, setSession] = useState<any>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showLabelModal, setShowLabelModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all')
  const [filterLabels, setFilterLabels] = useState<string[]>([])
  
  const {
    tasks,
    members,
    labels,
    taskAssignees,
    taskLabels,
    loading,
    createTask,
    updateTaskStatus,
    addTeamMember,
    addLabel
  } = useBoardData()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (!session) {
        signInAnonymously()
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInAnonymously = async () => {
    await supabase.auth.signInAnonymously()
  }

  const handleCreateTask = async (taskData: {
    title: string
    description: string
    priority: Priority
    due_date: string | null
    status: TaskStatus
    assigneeIds: string[]
    labelIds: string[]
  }) => {
    const newTask = await createTask({
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      due_date: taskData.due_date,
      status: taskData.status
    })
    if (newTask) {
      // 分配成员
      for (const memberId of taskData.assigneeIds) {
        await assignMemberToTask(newTask.id, memberId)
      }
      // 添加标签
      for (const labelId of taskData.labelIds) {
        await addLabelToTask(newTask.id, labelId)
      }
    }
    setShowTaskModal(false)
  }

  // 过滤任务
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
    const taskLabelIds = taskLabels[task.id] || []
    const matchesLabels = filterLabels.length === 0 || filterLabels.some(labelId => taskLabelIds.includes(labelId))
    return matchesSearch && matchesPriority && matchesLabels
  })

  if (!session) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <Spinner animation="border" variant="primary" />
        <span className="ms-3 text-muted">Initializing your workspace...</span>
      </div>
    )
  }

  return (
    <div className="bg-light min-vh-100">
      <Navbar bg="white" className="border-bottom shadow-sm">
        <Container fluid>
          <Navbar.Brand className="fw-bold text-primary">TaskFlow</Navbar.Brand>
          <Nav className="ms-auto">
            <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => setShowMemberModal(true)}>
              <FiUsers  className="me-1" /> Team
            </Button>
            <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => setShowLabelModal(true)}>
              <FiTag  className="me-1" /> Labels
            </Button>
            <Button variant="primary" size="sm" onClick={() => setShowTaskModal(true)}>
            <FiPlus className="me-1" /> New Task
            </Button>
          </Nav>
        </Container>
      </Navbar>

      <Container fluid className="py-4">
        <Row className="mb-4">
          <Col>
            <h1 className="display-6 fw-bold">Task Board</h1>
            <p className="text-muted">Visualize your work, achieve more</p>
          </Col>
        </Row>

        <StatsHeader tasks={filteredTasks} />
        
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterPriority={filterPriority}
          onPriorityChange={setFilterPriority}
          filterLabels={filterLabels}
          onLabelsChange={setFilterLabels}
          labels={labels}
        />

        <Board
          tasks={filteredTasks}
          members={members}
          labels={labels}
          taskAssignees={taskAssignees}
          taskLabels={taskLabels}
          onTaskMove={updateTaskStatus}
          loading={loading}
        />
      </Container>

      <TaskModal show={showTaskModal} onHide={() => setShowTaskModal(false)} onSubmit={handleCreateTask} members={members} labels={labels} />
      <TeamMemberModal show={showMemberModal} onHide={() => setShowMemberModal(false)} onAddMember={addTeamMember} members={members} />
      <LabelModal show={showLabelModal} onHide={() => setShowLabelModal(false)} onAddLabel={addLabel} labels={labels} />
    </div>
  )
}

export default App