import { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  updatedAt?: string;
}

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-5039eff7`;

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_URL}/tasks`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching tasks:', errorData);
        toast.error('Erro ao carregar tarefas');
        return;
      }
      
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Erro ao conectar com o servidor');
    }
  };

  const createTask = async () => {
    if (!newTaskText.trim()) {
      toast.error('Digite uma tarefa');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ text: newTaskText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error creating task:', errorData);
        toast.error('Erro ao criar tarefa');
        return;
      }

      const data = await response.json();
      setTasks([...tasks, data.task]);
      setNewTaskText('');
      toast.success('Tarefa criada!');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Erro ao criar tarefa');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (task: Task) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ completed: !task.completed }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error updating task:', errorData);
        toast.error('Erro ao atualizar tarefa');
        return;
      }

      const data = await response.json();
      setTasks(tasks.map(t => t.id === task.id ? data.task : t));
      toast.success(data.task.completed ? 'Tarefa concluída!' : 'Tarefa reaberta');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Erro ao atualizar tarefa');
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error deleting task:', errorData);
        toast.error('Erro ao deletar tarefa');
        return;
      }

      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success('Tarefa deletada!');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Erro ao deletar tarefa');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      createTask();
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <Toaster />
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Lista de Tarefas
          </h1>
          <p className="text-gray-600">
            Gerencie suas tarefas com backend e banco de dados
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nova Tarefa</CardTitle>
            <CardDescription>
              Adicione uma nova tarefa à sua lista
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Digite sua tarefa..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="flex-1"
              />
              <Button
                onClick={createTask}
                disabled={loading || !newTaskText.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Minhas Tarefas</CardTitle>
            <CardDescription>
              {totalCount === 0 
                ? 'Nenhuma tarefa ainda'
                : `${completedCount} de ${totalCount} concluída${totalCount > 1 ? 's' : ''}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>Nenhuma tarefa encontrada.</p>
                <p className="text-sm mt-2">Comece adicionando uma nova tarefa acima!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow group"
                  >
                    <button
                      onClick={() => toggleTask(task)}
                      className="flex-shrink-0 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : (
                        <Circle className="h-6 w-6" />
                      )}
                    </button>
                    <span
                      className={`flex-1 ${
                        task.completed
                          ? 'line-through text-gray-400'
                          : 'text-gray-800'
                      }`}
                    >
                      {task.text}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>✨ Aplicação com backend completo usando Supabase</p>
        </div>
      </div>
    </div>
  );
}
